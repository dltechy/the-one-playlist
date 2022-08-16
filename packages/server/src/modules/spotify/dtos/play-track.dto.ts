import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class PlayTrackDto {
  @ApiProperty({ description: 'The ID of the device to play the track on' })
  @IsString()
  @IsNotEmpty()
  public deviceId: string;
}
