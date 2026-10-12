import { Injectable ,Inject} from "@nestjs/common";
import { PrismaService } from "../../prisma";
import { PrimaryKey } from "@prisma/orm-postgres/family-contract";
@Injectable()
export class ProjectsRepository{
    constructor (@Inject(PrismaService) private readonly prisma:PrismaService,){}

    async findById(id: string ){
        return await this.prisma.db.orm.public.Projects.where({id:id}).first()
    }
    
    

}