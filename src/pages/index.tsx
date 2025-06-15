import React, { useState } from 'react';
import { Link, Helmet, IGetInitialProps } from 'umi';
import { Alert, Card, Col, Modal, Row } from 'antd';
import { UnorderedListOutlined, TrophyOutlined } from '@ant-design/icons';
import { formatTitle } from '@/utils/title-format.util';
import { api } from '@/services/api';
import ContactUs from '@/components/ContactUs';
import { formatUrl } from '@/configs/route.config';
import BeianLink from '@/components/BeianLink';
import pasteThenACLogo from '@/assets/paste-then-ac_logo.png';

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
              <Link
                to={formatUrl('Collection', {
                  id: process.env.SITE_ALIAS === 'cn' ? '由官方整理和维护的' : 'official',
                })}
              >
                <Card hoverable>
                  <h2>
                    <TrophyOutlined className="mr-3" />
                    榜单合集
                  </h2>
                  <p className="mt-4 mb-0">查阅由 SDUTACM 和 algoUX 团队精心整理的历年赛事榜单合集</p>
                </Card>
              </Link>
            </Col>
          </Row>
        </div>
        <div className="block">
          <h1 className="block-title">合作推广</h1>
          <Row gutter={16}>
            <Col className="mb-4" xs={24} sm={12}>
              <a href="https://paste.then.ac/?from=rankland" target="_blank">
                <Card hoverable>
                  <h2>
                    <img
                      src={pasteThenACLogo}
                      alt="paste.then.ac logo"
                      className="mr-3 inline-block"
                      style={{ width: '24px', height: '24px' }}
                    />
                    paste.then.ac
                  </h2>
                  <p className="mt-4 mb-0">自由、开放、更适合算竞宝宝体质的的剪贴板</p>
                </Card>
              </a>
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
                collection
              </a>
              ：长期维护的历年算竞榜单合集
            </li>

            <li>
              <a href="https://github.com/algoux/standard-ranklist-renderer-component" target="_blank">
                renderer-component
              </a>
              ：在 Web 项目中使用渲染组件展示标准榜单
            </li>
            <li>
              <a href="https://github.com/algoux/standard-ranklist-utils" target="_blank">
                utils
              </a>
              ：标准榜单开发实用工具
            </li>
            <li>
              <a href="https://github.com/algoux/standard-ranklist-convert-to" target="_blank">
                convert-to
              </a>
              ：转换标准榜单到 Excel、Gym Ghost、VJ 等其他格式
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
          <p>algoUX: Give your algorithm better UX</p>
          <p>
            Find us on{' '}
            <a href="https://github.com/algoux" target="_blank">
              GitHub
            </a>
          </p>
          <p>© 2022-present algoUX. All Rights Reserved.</p>
          <p>
            榜单访问统计：至少 {data?.statistics.totalViewCount ?? '-'} 次
          </p>
          <p>
            其他链接：
            <a href="https://algoux.org" target="_blank">
              首页
            </a>
            <span className="mx-2">|</span>
            <a href="https://servicestatus.algoux.org" target="_blank">
              服务状态
            </a>
          </p>
          {(process.env.SITE_ALIAS === 'cn' || process.env.SITE_ALIAS === 'cnn') && (
            <p>
              备案号：
              <BeianLink />
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
