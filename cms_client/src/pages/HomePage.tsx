import {Col, Empty, Pagination, Row, Skeleton} from 'antd';
import {useEffect} from 'react';
import ConcertCard from '../components/concert/ConcertCard';
import SearchFilter from '../components/concert/SearchFilter';
import {useConcertStore} from '../stores/concertStore';

export default function HomePage(): JSX.Element {
  const {loading, data, filter, setFilter, fetch} = useConcertStore();

  useEffect(() => {
    void fetch();
  }, [filter.page, filter.limit, filter.search, filter.status, fetch]);

  return (
    <div style={{padding: "0 16px"}}>
      <div style={{marginBottom: "24px"}}>
        <SearchFilter
          value={{search: filter.search, status: filter.status}}
          onChange={(v) => setFilter({...v, page: 1})}
          onSubmit={() => void fetch()}
        />
      </div>

      {loading && (
        <div style={{padding: "24px 0"}}>
          <Skeleton active/>
        </div>
      )}

      {!loading && (!data || data.items?.length === 0) && (
        <div style={{padding: "48px 0", textAlign: "center"}}>
          <Empty description="暂无演唱会"/>
        </div>
      )}

      {!loading && data?.items && data.items.length > 0 && (
        <>
          <Row
            gutter={[
              {xs: 12, sm: 16, md: 16, lg: 20, xl: 24},
              {xs: 12, sm: 16, md: 16, lg: 20, xl: 24},
            ]}
          >
            {data.items.map((c) => (
              <Col
                key={c.id}
                xs={24}
                sm={12}
                md={8}
                lg={6}
                xl={6}
                xxl={4}
                style={{
                  display: "flex",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    minHeight: "400px",
                    display: "flex",
                  }}
                >
                  <ConcertCard concert={c}/>
                </div>
              </Col>
            ))}
          </Row>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "32px 0 16px",
            }}
          >
            <Pagination
              current={filter.page}
              pageSize={filter.limit}
              total={data.total}
              showTotal={(total) => `共 ${total} 场演唱会`}
              showSizeChanger={false}
              onChange={(page) => {
                setFilter({page});
                window.scrollTo({top: 0, behavior: "smooth"});
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
