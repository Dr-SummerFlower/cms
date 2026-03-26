import { Concert } from '../concerts/entities/concert.entity';

/**
 * 演唱会列表查询时使用的数据库筛选条件。
 *
 * @category Model
 */
export interface ConcertQueryFilter {
  /** 演唱会状态。 */
  status?: 'upcoming' | 'ongoing' | 'completed';
  /** 演唱会名称模糊搜索条件。 */
  name?: {
    $regex: string;
    $options: string;
  };
  /** 演出日期条件。 */
  date?: Date | { $gte?: Date; $lte?: Date };
  /** 场馆筛选条件。 */
  venue?:
    | string
    | {
        $regex: string;
        $options: string;
      };
}

/**
 * 待发送提醒的演唱会及其收件人集合。
 *
 * @category Model
 */
export interface ConcertsReminder {
  /** 演唱会实体。 */
  concert: Concert;
  /** 需要接收提醒的邮箱列表。 */
  userEmails: string[];
}
