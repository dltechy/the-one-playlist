import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class PlayTrackParamsDto {
  @ApiProperty({ description: 'The ID of the track to play' })
  @IsString()
  @IsNotEmpty()
  public id: string;
}
