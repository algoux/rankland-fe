import '@algoux/standard-ranklist-renderer-component/dist/style.css';
import 'rc-dialog/assets/index.css';
import { Helmet, IGetInitialProps, Link, useParams } from 'umi';
import StyledRanklist from '@/components/StyledRanklist';
import { api } from '@/services/api';
import { Button, Spin } from 'antd';
import React from 'react';
import { LogicException, LogicExceptionKind } from '@/services/api/logic.exception';
import { formatTitle } from '@/utils/title-format.util';

// type MenuItem = Required<MenuProps>['items'][number];

// function getItem(
//   label: React.ReactNode,
//   key: React.Key,
//   icon?: React.ReactNode,
//   children?: MenuItem[],
//   type?: 'group',
// ): MenuItem {
//   return {
//     key,
//     icon,
//     children,
//     label,
//     type,
//   } as MenuItem;
// }

// const items: MenuItem[] = [
//   getItem('Navigation One', 'sub1', null, [
//     getItem('Option 1', '1'),
//     getItem('Option 2', '2'),
//     getItem('Option 3', '3'),
//     getItem('Option 4', '4'),
//   ]),
//   getItem('Navigation Two', 'sub2', null, [
//     getItem('Option 5', '5'),
//     getItem('Option 6', '6'),
//     getItem('Submenu', 'sub3', null, [
//       getItem('Option 7', '7'),
//       getItem('Option 8', '8', null, [
//         getItem('Option 101', '101'),
//         getItem('Option 102', '102', null, [
//           getItem('Option 1001', '1001'),
//           getItem('Option 1002', '1002', null, [
//             getItem('Option 10001', '10001'),
//             getItem('Option 10002', '10002', null, [
//               getItem('Option 100001', '100001'),
//             ]),
//           ]),
//         ]),
//       ]),
//     ]),
//   ]),
//   getItem('Navigation Three', 'sub4', null, [
//     getItem('Option 9', '9'),
//     getItem('Option 10', '10'),
//     getItem('Option 11', '11'),
//     getItem('Option 12', '12'),
//   ]),
// ];

// submenu keys of first level
const rootSubmenuKeys = ['sub1', 'sub2', 'sub4'];

export default function RanklistPage(props: IRanklistPageProps) {
  const { data, error } = props;

  // const [openKeys, setOpenKeys] = useState(['sub1']);
  // const onOpenChange: MenuProps['onOpenChange'] = (keys) => {
  //   const latestOpenKey = keys.find((key) => openKeys.indexOf(key) === -1);
  //   if (rootSubmenuKeys.indexOf(latestOpenKey!) === -1) {
  //     setOpenKeys(keys);
  //   } else {
  //     setOpenKeys(latestOpenKey ? [latestOpenKey] : []);
  //   }
  // };

  const { id } = useParams<{ id: string }>();
  // const { loading, data, error } = useReq(() => api.getRanklist({ uniqueKey: id }));
  if (error) {
    if (error instanceof LogicException && error.kind === LogicExceptionKind.NotFound) {
      return (
        <div className="mt-16 text-center">
          <Helmet>
            <title>{formatTitle('Not Found')}</title>
          </Helmet>
          <h3 className="mb-4">Ranklist Not Found</h3>
          <Link to="/">
            <Button type="primary" size="small">
              Back to Home
            </Button>
          </Link>
        </div>
      );
    }
    return (
      <div className="mt-16 text-center">
        <Helmet>
          <title>{formatTitle()}</title>
        </Helmet>
        <p>An error occurred while loading data</p>
        <Button type="primary" size="small" onClick={() => location.reload()}>
          Refresh
        </Button>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="mt-16 text-center">
        <Helmet>
          <title>{formatTitle()}</title>
        </Helmet>
        <Spin />
      </div>
    );
  }
  return (
    <div>
      <Helmet>
        <title>{formatTitle(data!.info.name)}</title>
      </Helmet>
      {/* <Menu
        mode="inline"
        openKeys={openKeys}
        onOpenChange={onOpenChange}
        style={{ width: 256 }}
        items={items}
      /> */}
      <div className="mt-8 mb-8">
        <StyledRanklist data={data!.srk} name={id} meta={data!.info} />
      </div>
    </div>
  );
}

interface IPageParams {
  id: string;
}

const asyncData = ({ id }: { id: string }) => {
  return api.getRanklist({ uniqueKey: id });
};

RanklistPage.getInitialProps = (async (ctx) => {
  try {
    const res = await asyncData({ id: ctx.match.params.id });
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
}) as IGetInitialProps<any, IPageParams>;

type IPageAsyncData = Awaited<ReturnType<typeof asyncData>>;

export interface IRanklistPageProps {
  data?: IPageAsyncData;
  error?: Error;
}
