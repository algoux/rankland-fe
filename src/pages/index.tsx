import { Link, Helmet, IGetInitialProps } from 'umi';
import { Card, Col, Modal, Row } from 'antd';
import { UnorderedListOutlined, TrophyOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { formatTitle } from '@/utils/title-format.util';
import { api } from '@/services/api';

export default function HomePage(props: IHomePageProps) {
  const { data } = props;
  const [isQQGroupModalVisible, setIsQQGroupModalVisible] = useState(false);

  return (
    <div className="normal-content">
      <Helmet>
      <title>{formatTitle()}</title>
      </Helmet>
      <div className="home-intro">
        <h1 style={{ fontSize: '32px' }}>欢迎来到 RankLand</h1>
        <p className="text-base">
          这里是一个由算法竞赛爱好者们自发维护的、专注于托管和分享任何竞赛榜单的宝地，你可以轻松查阅 ICPC、CCPC
          等赛事的历史榜单。
        </p>
        <div className="block">
          <h1 className="block-title">为你推荐</h1>
          <Row gutter={16}>
            <Col className="mb-4" xs={24} sm={12}>
              <Link to="/search">
                <Card hoverable>
                  <h2>
                    <UnorderedListOutlined className="mr-3" />
                    探索
                  </h2>
                  <p className="mt-4 mb-0">
                    在 <strong>{data?.statistics.totalSrkCount ?? '-'}</strong> 个高质量程序设计竞赛榜单中自由浏览和搜索
                  </p>
                </Card>
              </Link>
            </Col>
            <Col className="mb-4" xs={24} sm={12}>
              <Link to="/collection/official">
                <Card hoverable>
                  <h2>
                    <TrophyOutlined className="mr-3" />
                    榜单合集
                  </h2>
                  <p className="mt-4 mb-0">直接查阅由 SDUTACM 和 algoUX 团队精心分类整理的历年赛事榜单合集</p>
                </Card>
              </Link>
            </Col>
          </Row>
        </div>
        <div className="block">
          <h1 className="block-title">相关资源</h1>
          <ul>
            <li>
              <a href="https://github.com/algoux/standard-ranklist" target="_blank">
                Standard Ranklist
              </a>
              ：标准榜单格式（srk）旨在标准化榜单数据，欢迎了解和共建生态
            </li>
            <li>
              <Link to="/playground">
                Playground
              </Link>
              ：在线调试和预览 srk 格式的榜单数据
            </li>
            <li>
              <a href="https://github.com/algoux/standard-ranklist-renderer-component" target="_blank">
                Renderer Component
              </a>
              ：在你的前端项目中使用渲染组件展示 srk 数据
            </li>
          </ul>
        </div>
        <div className="block">
          <h1 className="block-title">联系我们</h1>
          <p>
            如果你想要贡献榜单或为赛事寻求免费的外榜托管，欢迎
            <a onClick={() => setIsQQGroupModalVisible(true)}>与我们联系</a>。
          </p>
          <Modal
            title="联系我们"
            visible={isQQGroupModalVisible}
            footer={null}
            onCancel={() => setIsQQGroupModalVisible(false)}
          >
            <div>
              <p>联系邮箱：<a href="mailto:algoux.org@gmail.com">algoux.org@gmail.com</a></p>
              <p>或加入讨论群：</p>
              <img src="/dist/rankland_qqgroup.jpg" className="w-full" />
            </div>
          </Modal>
        </div>
        <div className="block">
          <h1 className="block-title">关于我们</h1>
          <p>algoUX: Learning algorithm with better UX</p>
          <p>
            Find us on{' '}
            <a href="https://github.com/algoux" target="_blank">
              GitHub
            </a>
          </p>
          <p>© 2022 algoUX. All Rights Reserved.</p>
        </div>
      </div>
    </div>
  );
}

const asyncData = async () => {
  const statistics = await api.getStatistics();
  return {
    statistics,
  };
};

HomePage.getInitialProps = (async (ctx) => {
  try {
    const res = await asyncData();
    return {
      data: res,
    };
  } catch (e) {
    if (ctx.isServer) {
      throw e;
    }
    console.error(e);
    return {
      error: e,
    };
  }
}) as IGetInitialProps<any, {}>;

type IPageAsyncData = Awaited<ReturnType<typeof asyncData>>;

export interface IHomePageProps {
  data?: IPageAsyncData;
  error?: Error;
}
