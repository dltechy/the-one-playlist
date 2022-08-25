import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetTracksQueryDto {
  @ApiProperty({ description: 'The list of IDs of the tracks to retrive' })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  public trackIds: string[];
}
