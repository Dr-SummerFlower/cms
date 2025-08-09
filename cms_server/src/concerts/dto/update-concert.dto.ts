import { PartialType } from '@nestjs/swagger';
import { CreateConcertDto } from './create-concert.dto';

/**
 * 更新演唱会数据传输对象
 * @class UpdateConcertDto
 * @extends {PartialType<CreateConcertDto>}
 * @description 定义更新演唱会时需要提供的数据结构，继承自CreateConcertDto的部分类型
 */
export class UpdateConcertDto extends PartialType(CreateConcertDto) {}
