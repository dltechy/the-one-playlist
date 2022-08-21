import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetPlaylistParamsDto {
  @ApiProperty({ description: 'The ID of the playlist to retrive' })
  @IsString()
  @IsNotEmpty()
  public id: string;
}
