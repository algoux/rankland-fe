import { Ranklist } from '@algoux/standard-ranklist-renderer-component';
import type { EnumTheme } from '@algoux/standard-ranklist-renderer-component/dist/lib/Ranklist'
import '@algoux/standard-ranklist-renderer-component/dist/style.css';
import data from '@/assets/demo.json';
import 'rc-dialog/assets/index.css';
import { Alert } from 'antd';
import { useState } from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { Helmet, useModel } from 'umi';

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

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div role="alert" style={{ maxWidth: '400px', margin: '100px auto' }}>
      <Alert message="Error occurred when rendering srk" description={error.message} type="error" showIcon />
    </div>
  );
}

export default function RanklistPage() {
  const { theme } = useModel('theme');

  // const [openKeys, setOpenKeys] = useState(['sub1']);
  // const onOpenChange: MenuProps['onOpenChange'] = (keys) => {
  //   const latestOpenKey = keys.find((key) => openKeys.indexOf(key) === -1);
  //   if (rootSubmenuKeys.indexOf(latestOpenKey!) === -1) {
  //     setOpenKeys(keys);
  //   } else {
  //     setOpenKeys(latestOpenKey ? [latestOpenKey] : []);
  //   }
  // };

  return (
    <div>
      <Helmet>
        <title>{data.contest.title} | RankLand</title>
      </Helmet>
      {/* <Menu
        mode="inline"
        openKeys={openKeys}
        onOpenChange={onOpenChange}
        style={{ width: 256 }}
        items={items}
      /> */}
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <h1 style={{ textAlign: 'center', margin: '32px 0' }}>{data.contest.title}</h1>
        <Ranklist data={data as any} theme={theme as EnumTheme} />
      </ErrorBoundary>
    </div>
  );
}
