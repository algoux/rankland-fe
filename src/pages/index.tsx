import React, { useState } from 'react';
import { Link, Helmet, IGetInitialProps } from 'umi';
import { Alert, Card, Col, Modal, Row } from 'antd';
import { UnorderedListOutlined, TrophyOutlined } from '@ant-design/icons';
import { formatTitle } from '@/utils/title-format.util';
import { api } from '@/services/api';
import ContactUs from '@/components/ContactUs';
import { formatUrl } from '@/configs/route.config';
import BeianLink from '@/components/BeianLink';

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
              <Link to={formatUrl('Search')}>
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
              <Link to={formatUrl('Collection', { id: process.env.SITE_ALIAS === 'cn' ? '由官方整理和维护的' : 'official' })}>
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
          <h1 className="block-title">资源和生态</h1>
          <ul>
            <li>
              <a href="https://github.com/algoux/standard-ranklist" target="_blank">
                Standard Ranklist
              </a>
              ：标准榜单格式（srk）旨在标准化榜单数据，欢迎了解和共建生态
            </li>
            <li>
              <a href="https://github.com/algoux/srk-collection" target="_blank">
                Srk Collection
              </a>
              ：精心维护的榜单合集，欢迎参与
            </li>
            <li>
              <Link to={formatUrl('Playground')}>Playground</Link>
              ：在线调试和预览 srk 格式的榜单数据
            </li>
            <li>
              <a href="https://github.com/algoux/standard-ranklist-renderer-component" target="_blank">
                Renderer Component
              </a>
              ：在你的前端项目中使用渲染组件展示标准榜单
            </li>
          </ul>
        </div>
        <div className="block">
          <h1 className="block-title">联系我们</h1>
          <p>
            如要为赛事寻求免费的实时外榜托管或希望补全/纠正本站数据，欢迎
            <ContactUs>
              <a>与我们联系</a>
            </ContactUs>
            。
          </p>
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
          <p>© 2022-2023 algoUX. All Rights Reserved.</p>
          <p>
            其他链接：
            <a href="https://algoux.org" target="_blank">
              首页
            </a>
            <span className="mx-2">|</span>
            <a href="https://service-status.algoux.org/status/rankland" target="_blank">
              服务状态
            </a>
          </p>
          {(process.env.SITE_ALIAS === 'cn' || process.env.SITE_ALIAS === 'cnn') && (
            <p>
              备案号：<BeianLink />
            </p>
          )}
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
