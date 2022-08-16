import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetPlaylistTracksParamsDto {
  @ApiProperty({
    description: 'The ID of the playlist to retrive the tracks from',
  })
  @IsString()
  @IsNotEmpty()
  public id: string;
}
