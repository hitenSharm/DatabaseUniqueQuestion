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
    //if an object arrives and points to 2 different secondaries of the same parent-> no linking needs to be done!
    //path compression based on age here kinda
    //younger age -> sec and link to primary

    //---------------------------------------------

    //case 3:
    //a OR b point to id-x; make the one which doesent point anywhere to the object {a,b}
    //again apply case 2 as {a,b}, {a or b(whichever existed)};

    async allLinksFinder(parentObject):Promise<ContactResponseDTO>{
        let parentId=parentObject.id;
        let children: Contact[] =  await this.contactRepo.find({where:{linkedId:parentId}});                

        let allEmails:string[]=[];
        let allNumbers:string[]=[];
        let allIds:number[]=[];

        children.forEach((child)=>{
            if(child.email)
            allEmails.push(child.email);

            if(child.phoneNumber)
            allNumbers.push(child.phoneNumber);

            allIds.push(child.id);
        });       
        
        
        let ans:ContactResponseDTO={
            contact:{
                primaryContactId:parentId,
                emails:allEmails,
                phoneNumbers:allNumbers,
                secondaryContactIds:allIds
            }
        }
        
        return ans;
    }

    async parentFinder(responseObject: any) {
        if (responseObject.linkedId === null) {
            return responseObject;
        }
        //recursively find
        responseObject = await this.contactRepo.findOne({where:{id:responseObject.linkedId}});
        return this.parentFinder(responseObject);
    }

    async add(responseObject1,responseObject2){
        if(responseObject1.createdAt && responseObject2.createdAt && responseObject1.createdAt>responseObject2.createdAt){
            return this.add(responseObject2,responseObject1);
        }
        if(responseObject1.id && responseObject2.id && responseObject1.id == responseObject2.id){
            console.log("self loop")
            //this && for 'id' is for not needing to check on a newContact in case 3
            return responseObject1; //cant go to parent anymore
            //self loop
        }
        //obj 1 is older
        responseObject2.linkPrecedence='secondary';
        responseObject2.linkedId=responseObject1.id;
        return this.contactRepo.save(responseObject2).then(()=>{
            return responseObject1;
        });        
    }

    async identityFinder(requestDTO: RequestDTO): Promise<ContactResponseDTO>{
        //case 1
        const { email, phoneNumber } = requestDTO;        
        
        if(!email && !phoneNumber)return null;
        //unexpected behaviour cases
        let emailFinderResp = (email !== null ? await this.contactRepo.findOne({ where: { email } }) : null);
        let numberFinderResp = (phoneNumber !== null ? await this.contactRepo.findOne({ where: { phoneNumber: phoneNumber } }) : null);

        if(emailFinderResp && numberFinderResp && emailFinderResp.id === numberFinderResp.id){
            let parent=await this.parentFinder(numberFinderResp);            
            let ans=await this.allLinksFinder(parent); //same object (object alrady exists)
            
            return ans;
        }

        
        //case 2
        if (emailFinderResp && numberFinderResp) {
            //go to parent
            emailFinderResp = await this.parentFinder(emailFinderResp);
            numberFinderResp = await this.parentFinder(numberFinderResp);

            let res=await this.add(emailFinderResp,numberFinderResp);              
            // res=await this.allLinksFinder(res);
            // console.log(res);
            // return res;
            return this.allLinksFinder(res).then((res)=>{return res});
        }
        
        const newContact = new Contact();
        newContact.email = email;
        newContact.phoneNumber = phoneNumber;        
        newContact.linkPrecedence='primary';


        if(!numberFinderResp && emailFinderResp)
        {
            //create that as an entity and as we KNOW that we have an object relating to email provided, we must link
            emailFinderResp = await this.parentFinder(emailFinderResp);
            //get to its parent
            let res=await this.add(emailFinderResp,newContact);            
            res= await this.allLinksFinder(res);
            return res;
        }

        if(!emailFinderResp && numberFinderResp)
        {
            numberFinderResp = await this.parentFinder(numberFinderResp);
            //here i know that number is older
            let res=await this.add(numberFinderResp,newContact);        
            res= await this.allLinksFinder(res);
            return res;
        }
        //case 3-----------------done
        console.log("new contact!")

        let res = await this.contactRepo.save(newContact);
        return this.allLinksFinder(res);
    }


}
