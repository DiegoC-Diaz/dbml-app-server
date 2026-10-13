import { Injectable ,Inject} from "@nestjs/common";
import { PrismaService } from "../../prisma/index.js";

@Injectable()
export class ProjectsRepository{
    constructor (@Inject(PrismaService) private readonly prisma:PrismaService,){}

    async findById(id: string ){
        return await this.prisma.db.orm.public.Projects.where({id:id}).first()
    }
    
    

}