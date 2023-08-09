import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Contact } from './entities/contact.entity';
import { Repository } from 'typeorm';

@Controller('identify')
export class ContactsController {

    constructor(
        @InjectRepository(Contact)
        private readonly contactRepository:Repository<Contact>,
    ){}

    @Get()
    async findAll(): Promise<Contact[]> {        
        return this.contactRepository.find();
      }

}
