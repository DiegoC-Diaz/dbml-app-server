import { Injectable, Inject } from '@nestjs/common';
import { User } from './dto/user.js';
import { UserRecord, UsersRepository } from './users.repository.js';

@Injectable()
export class UsersService {

    constructor(@Inject(UsersRepository) private readonly usersRepo: UsersRepository,  ){

    }

    async findByEmail(email: string): Promise<User | null> {
        const record = await this.usersRepo.findByEmail(email);
        return record ? this.toUser(record) : null;
    }

    async findById(id: string): Promise<User | null> {
        const record = await this.usersRepo.findById(id);
        return record ? this.toUser(record) : null;
    }

    async create(data: import('./dto/create.user.dto.js').CreateUserDTO): Promise<User> {
        const record = await this.usersRepo.create(data);
        return this.toUser(record);
    }

    private toUser(record: UserRecord): User {
        return {
            createdAt: record.createdAt,
            email: String(record.email),
            emailVerified: record.emailVerified,
            githubId: record.githubId === null ? null : String(record.githubId),
            id: record.id,
            isActive: record.isActive,
            passwordHash:
                record.passwordHash === null ? null : String(record.passwordHash),
            updatedAt: record.updatedAt,
            username: String(record.username),
        };
    }
}
