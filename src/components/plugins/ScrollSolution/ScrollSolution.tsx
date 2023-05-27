import React from 'react';
import { ToastContainer, toast, Zoom } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.less';
import * as srk from '@algoux/standard-ranklist';
import { resolveText } from '@algoux/standard-ranklist-renderer-component';

export interface ScrollSolutionDataItem {
  problem: {
    alias: string;
  };
  score: {
    value: srk.RankScore['value'];
  };
  result: Exclude<srk.SolutionResultFull, null>;
  user: {
    name: srk.User['name'];
    organization: srk.User['organization'];
  };
}

export interface ScrollSolutionProps {
  containerMaxHeight?: number;
}

interface State {
  popLimit: number;
}

const ITEM_HEIGHT = 45;
const RJ_DELAY = 10 * 1000;
const DELAY_MAP = {
  FB: 180 * 1000,
  AC: 20 * 1000,
  RJ: RJ_DELAY,
  '?': 10 * 1000,
  WA: RJ_DELAY,
  PE: RJ_DELAY,
  TLE: RJ_DELAY,
  MLE: RJ_DELAY,
  OLE: RJ_DELAY,
  RTE: RJ_DELAY,
  CE: RJ_DELAY,
  UKE: RJ_DELAY,
};
const POP_LIMIT = 20;
const POP_INTERVAL = 200; // ms
const MIN_DELAY = 1000; // ms

export default class ScrollSolution extends React.Component<ScrollSolutionProps, State> {
  public static defaultProps: Partial<ScrollSolutionProps> = {
    containerMaxHeight: 0,
  };

  private _queue: ScrollSolutionDataItem[] = [];
  private _popInterval: number = POP_INTERVAL;

  public constructor(props: ScrollSolutionProps) {
    super(props);
    this.state = {
      popLimit: props.containerMaxHeight ? Math.floor(props.containerMaxHeight / ITEM_HEIGHT) : POP_LIMIT,
    };
  }

  public componentDidMount() {
    this.popFromQueue();
  }

  // eslint-disable-next-line @typescript-eslint/member-ordering
  public static getDerivedStateFromProps(props: ScrollSolutionProps, state: State) {
    const popLimit = props.containerMaxHeight ? Math.floor(props.containerMaxHeight / ITEM_HEIGHT) : POP_LIMIT;
    if (popLimit !== state.popLimit) {
      return {
        popLimit,
      };
    }
    return null;
  }

  public pop(data: ScrollSolutionDataItem, delay: number) {
    toast(
      <div className="container">
        <div className="score">{data.score.value}</div>
        <div className="user">
          <span className="user-name">{resolveText(data.user.name)}</span>
          {data.user.organization && <span className="user-second-name">{resolveText(data.user.organization)}</span>}
        </div>
        <div className="problem">{data.problem.alias}</div>
        {this.renderResultLabel(data.result)}
      </div>,
      {
        autoClose: delay,
      },
    );
  }

  public pushSolutions(rows: ScrollSolutionDataItem[]) {
    // console.log('handleSolutions', rows);
    const count = rows.length;
    if (!count) {
      return;
    }
    for (const d of rows) {
      if (d.result === 'FB') {
        this.pop(d, DELAY_MAP[d.result]);
      } else {
        this._queue.push(d);
      }
    }
  }

  public popFromQueue() {
    if (this._queue.length > 0) {
      // console.warn('popFromQueue', this._queue.length, this._popInterval);
      // const maxPopInterval = this.props.interval / this.state.popLimit;
      const maxPopInterval = 100;
      let delay: number = DELAY_MAP[this._queue[0].result];
      if (this._queue.length <= this.state.popLimit) {
        this._popInterval = maxPopInterval;
      } else {
        const scale = Math.max(1 / (this._queue.length / this.state.popLimit) - 0.5, 0.01);
        // console.log('scale', scale);
        delay = MIN_DELAY + DELAY_MAP[this._queue[0].result] * scale;
        this._popInterval = maxPopInterval * scale;
      }
      // console.log('popFromQueue pop:', delay);
      this.pop(this._queue[0], delay);
      this._queue.splice(0, 1);
    }
    setTimeout(() => this.popFromQueue(), this._popInterval);
  }

  public renderResultLabel(result: ScrollSolutionDataItem['result']) {
    switch (result) {
      case 'FB':
        return (
          <div className="result result-fb">
            <span>{result}</span>
          </div>
        );
      case 'AC':
        return <div className="result result-ac">{result}</div>;
      case 'RJ':
      case 'WA':
      case 'PE':
      case 'TLE':
      case 'MLE':
      case 'OLE':
      case 'RTE':
      case 'CE':
      case 'UKE':
        return <div className="result result-rj">{result}</div>;
      case '?':
        return <div className="result result-fz">?</div>;
      default:
        return <div className="result">--</div>;
    }
  }

  public render() {
    return (
      <ToastContainer
        className="plugin_scroll-solution-container"
        position="bottom-left"
        autoClose={10000}
        hideProgressBar
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss={false}
        draggable={false}
        pauseOnHover={false}
        closeButton={false}
        transition={Zoom}
        limit={this.state.popLimit}
      />
    );
  }
}
