import { Col, Empty, Row, Skeleton } from 'antd';
import { useEffect } from 'react';
import ConcertCard from '../components/concert/ConcertCard';
import SearchFilter from '../components/concert/SearchFilter';
import { useConcertStore } from '../stores/concertStore';

export default function HomePage(): JSX.Element {
  const { loading, data, filter, setFilter, fetch } = useConcertStore();

  useEffect(() => {
    void fetch();
  }, [filter.page, filter.limit, filter.search, filter.status, fetch]);

  return (
    <div>
      <SearchFilter
        value={{ search: filter.search, status: filter.status }}
        onChange={(v) => setFilter({ ...v, page: 1 })}
        onSubmit={() => void fetch()}
      />

      {loading && <Skeleton active />}
      {!loading && (!data || data.items?.length === 0) && (
        <Empty description="暂无演唱会" />
      )}

      <Row gutter={[16, 16]}>
        {data?.items?.map((c) => (
          <Col key={c.id} xs={24} sm={12} md={8} lg={6}>
            <ConcertCard concert={c} />
          </Col>
        ))}
      </Row>
    </div>
  );
}
