import {
  Body, Controller, Delete, Get, Param, ParseUUIDPipe,
  Post, Put, Request, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { AuthUser } from '../auth/strategies/jwt.strategy.js';
import { CreateThesisDto } from './dto/create-thesis.dto.js';
import { CreateCriterionDto } from './dto/create-criterion.dto.js';
import { SubmitConfidenceDto } from './dto/submit-confidence.dto.js';
import { TriggerCriterionDto } from './dto/trigger-criterion.dto.js';
import { ThesesService } from './theses.service.js';

interface AuthRequest {
  user: AuthUser;
}

@Controller('theses')
export class ThesesController {
  constructor(private readonly theses: ThesesService) {}

  @Get()
  findPublic() {
    return this.theses.findPublic();
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  findMine(@Request() req: AuthRequest) {
    return this.theses.findByOwner(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req: Partial<AuthRequest>) {
    return this.theses.findOne(id, req.user?.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateThesisDto, @Request() req: AuthRequest) {
    return this.theses.create(dto, req.user.id);
  }

  @Post(':id/confidence')
  @UseGuards(JwtAuthGuard)
  submitConfidence(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitConfidenceDto,
    @Request() req: AuthRequest,
  ) {
    return this.theses.addConfidence(id, req.user.id, dto.confidence, dto.rationale);
  }

  // --- Criteria endpoints ---

  @Post(':id/criteria')
  @UseGuards(JwtAuthGuard)
  addCriterion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCriterionDto,
    @Request() req: AuthRequest,
  ) {
    return this.theses.addCriterion(id, req.user.id, dto);
  }

  @Put(':id/criteria/:logicalId')
  @UseGuards(JwtAuthGuard)
  editCriterion(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('logicalId', ParseUUIDPipe) logicalId: string,
    @Body() dto: CreateCriterionDto,
    @Request() req: AuthRequest,
  ) {
    return this.theses.editCriterion(id, req.user.id, logicalId, dto);
  }

  @Delete(':id/criteria/:logicalId')
  @UseGuards(JwtAuthGuard)
  retireCriterion(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('logicalId', ParseUUIDPipe) logicalId: string,
    @Request() req: AuthRequest,
  ) {
    return this.theses.retireCriterion(id, req.user.id, logicalId);
  }

  @Post(':id/criteria/:logicalId/trigger')
  @UseGuards(JwtAuthGuard)
  triggerCriterion(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('logicalId', ParseUUIDPipe) logicalId: string,
    @Body() dto: TriggerCriterionDto,
    @Request() req: AuthRequest,
  ) {
    return this.theses.triggerCriterion(id, req.user.id, logicalId, dto.outcome);
  }

  @Get(':id/criteria/:logicalId/history')
  criterionHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('logicalId', ParseUUIDPipe) logicalId: string,
  ) {
    return this.theses.getCriterionHistory(id, logicalId);
  }
}
