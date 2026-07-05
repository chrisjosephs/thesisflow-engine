import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Thesis, ThesisVisibility } from './thesis.entity.js';
import { CreateThesisDto } from './dto/create-thesis.dto.js';

@Injectable()
export class ThesesService {
  constructor(
    @InjectRepository(Thesis)
    private readonly repo: Repository<Thesis>,
  ) {}

  findPublic(): Promise<Thesis[]> {
    return this.repo.find({
      where: { visibility: ThesisVisibility.PUBLIC },
      order: { createdAt: 'DESC' },
    });
  }

  findByOwner(userId: string): Promise<Thesis[]> {
    return this.repo.find({
      where: { ownerUserId: userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, requestingUserId?: string): Promise<Thesis> {
    const thesis = await this.repo.findOne({ where: { id } });
    if (!thesis) throw new NotFoundException('Thesis not found');

    if (thesis.visibility === ThesisVisibility.PRIVATE) {
      if (!requestingUserId || thesis.ownerUserId !== requestingUserId) {
        throw new ForbiddenException('This thesis is private');
      }
    }

    return thesis;
  }

  create(dto: CreateThesisDto, ownerId: string): Promise<Thesis> {
    return this.repo.save(this.repo.create({ ...dto, ownerUserId: ownerId }));
  }
}
