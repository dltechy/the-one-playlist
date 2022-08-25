import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetAlbumParamsDto {
  @ApiProperty({ description: 'The ID of the album to retrive' })
  @IsString()
  @IsNotEmpty()
  public id: string;
}
