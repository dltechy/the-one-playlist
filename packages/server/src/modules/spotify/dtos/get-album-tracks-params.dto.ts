import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetAlbumTracksParamsDto {
  @ApiProperty({
    description: 'The ID of the album to retrive the tracks from',
  })
  @IsString()
  @IsNotEmpty()
  public id: string;
}
