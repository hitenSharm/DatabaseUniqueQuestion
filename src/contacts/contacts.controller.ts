import { Body, Controller, Get,Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Contact } from './entities/contact.entity';
import { Repository } from 'typeorm';
import { ContactsService } from './contacts.service';
import { RequestDTO } from './dtos/requestDTO.dto';

@Controller('identify')
export class ContactsController {

    constructor(
        private readonly contactService:ContactsService
    ){}    

    @Post()
    async findAll(@Body() request:RequestDTO): Promise<Contact[]> {        
        let res=await this.contactService.identityFinder(request);
        return null;
      }

}
