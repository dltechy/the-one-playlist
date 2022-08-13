import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetVideosQueryDto {
  @ApiProperty({ description: 'The list of IDs of the videos to retrieve' })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  public videoIds: string[];
}
