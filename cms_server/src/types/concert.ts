/**
 * @interface
 * @property {string} status - 演唱会状态
 * @property {object} name - 演唱会名称查询条件
 * @property {Date} date - 演唱会日期
 * @property {string} venue - 演唱会场馆
 */
export interface ConcertQueryFilter {
  status?: 'upcoming' | 'ongoing' | 'completed';
  name?: {
    $regex: string;
    $options: string;
  };
  date?: Date | { $gte?: Date; $lte?: Date };
  venue?:
    | string
    | {
        $regex: string;
        $options: string;
      };
}