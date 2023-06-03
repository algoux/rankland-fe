import type * as srk from '@algoux/standard-ranklist';
import { resolveText } from '@algoux/standard-ranklist-renderer-component';
import './UserInfoModal.less';

export interface IUserInfoModalProps {
  user: srk.User;
  row: srk.RanklistRow;
  index: number;
  ranklist: srk.Ranklist;
}

export default function UserInfoModal(props: IUserInfoModalProps) {
  const { user, row, ranklist } = props;
  // @ts-ignore
  const mainSegmentIndex = row.rankValues[0]?.segmentIndex;
  let matchedSeries = ranklist.series?.[0].segments?.[mainSegmentIndex];
  // if (!matchedSeries && (user.official === undefined || user.official === true)) {
  //   matchedSeries = { style: 'iron', title: '优胜奖' };
  // }
  const hasMembers = !!user.teamMembers && user.teamMembers.length > 0;
  const id = `um-img-${user.id}`;
  const handleImgError = () => {
    const img = document.getElementById(id);
    img?.style.setProperty('display', 'none');
  };
  // @ts-ignore
  const photo = user.x_photo as string | undefined;
  // @ts-ignore
  const slogan = user.x_slogan as string | undefined;
  return (
    <div className="user-modal">
      <p className="mb-0">{user.organization}</p>
      {user.official === false && <p className="mt-4 mb-0">* 非正式参加者</p>}
      {hasMembers && (
        <div className="user-modal-info-team-members mt-2">
          {user.teamMembers!.map((m, mIndex) => (
            <span key={resolveText(m.name)}>
              {mIndex > 0 && <span className="user-modal-info-team-members-slash"> / </span>}
              <span>{resolveText(m.name)}</span>
            </span>
          ))}
        </div>
      )}
      {matchedSeries && (
        <p className="mt-4 mb-0">
          所在奖区：
          <span className={`user-modal-segment-label bg-segment-${matchedSeries.style}`}>{matchedSeries.title}</span>
        </p>
      )}
      <div className="mt-4">
        {photo && (
          <img
            id={id}
            key={id}
            src={`${process.env.X_PHOTO_BASE}${photo}`}
            alt="选手照片"
            style={{ width: '100%' }}
            onError={handleImgError}
          />
        )}
        {slogan && <p className="slogan mt-4 mb-2">{slogan}</p>}
      </div>
    </div>
  );
}
