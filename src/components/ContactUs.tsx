import React, { useState } from 'react';
import Modal from 'antd/lib/modal/Modal';
// @ts-ignore
import qqGroupImg from '@/assets/rankland_qqgroup.jpg';

export default function ContactUs(props: any) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Modal
        title="联系我们"
        visible={visible}
        footer={null}
        onCancel={() => setVisible(false)}
      >
        <div>
          <p>
            联系邮箱：<a href="mailto:algoux.org@gmail.com">algoux.org@gmail.com</a>
          </p>
          <p>或加入讨论群：</p>
          <img src={qqGroupImg} className="w-full" />
        </div>
      </Modal>
      <span onClick={() => setVisible(true)}>{props.children}</span>
    </>
  );
}
