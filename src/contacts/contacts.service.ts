import { Injectable } from '@nestjs/common';
import { RequestDTO } from './dtos/requestDTO.dto';
import { ContactResponseDTO } from './dtos/contactResponse.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Contact } from './entities/contact.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ContactsService {

    constructor(
        @InjectRepository(Contact)
        private contactRepo: Repository<Contact>
    ) { }

    //dsu type data strucutre tree
    //data -> email,number
    //email->a ; number->b

    //case 1 : {a,b} is already present
    //return ; -> double registration

    //case 2:------------ main case ---------------

    //a-> id1, b->id2;
    //id1 can be from secondary -> go to parent(primary)
    //same for id2;

    //path compression based on age here kinda
    //younger age -> sec and link to primary

    //---------------------------------------------

    //case 3:
    //a OR b point to id-x; make the one which doesent point anywhere to the object {a,b}
    //again apply case 2 as {a,b}, {a or b(whichever existed)};

    async parentFinder(responseObject: any) {
        if (responseObject.linkedId === null) {
            return responseObject;
        }
        //recursivly find
        responseObject = await this.contactRepo.findOne(responseObject.linkedId);
        return this.parentFinder(responseObject);
    }

    async add(responseObject1,responseObject2){
        if(responseObject1.createdAt>responseObject2.createdAt){
            return this.add(responseObject2,responseObject1);
        }
        if(responseObject1.id == responseObject2.id){
            console.log("self loop")
            return null;
            //self loop
        }
        //obj 1 is older
        responseObject2.linkPrecedence='secondary';
        responseObject2.linkedId=responseObject1.id;
        return this.contactRepo.save(responseObject2);
    }

    async identityFinder(requestDTO: RequestDTO): Promise<ContactResponseDTO> {
        //case 1
        const { email, phoneNumber } = requestDTO;        
        

        let emailFinderResp = await this.contactRepo.findOne({ where: { email } });
        let numberFinderResp = await this.contactRepo.findOne({ where: { phoneNumber: phoneNumber } });
        if(emailFinderResp === numberFinderResp){
            return null;
        }

        
        //case 2
        if (emailFinderResp && numberFinderResp) {
            //go to parent
            emailFinderResp = await this.parentFinder(emailFinderResp);
            numberFinderResp = await this.parentFinder(numberFinderResp);

            let ans=await this.add(emailFinderResp,numberFinderResp);    
            console.log(ans);
            return ans;
        }



        const newContact = new Contact();
        newContact.email = email;
        newContact.phoneNumber = phoneNumber;

        newContact.linkPrecedence='primary';

        let res = await this.contactRepo.save(newContact);
        return null;
    }


}
