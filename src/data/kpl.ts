/** KPL 战队与选手数据。阵容参考 2026 挑战者杯公开大名单 / 定妆照，赛训与首发可能随场次调整。 */

export type PlayerRole = "对抗路" | "打野" | "中路" | "发育路" | "游走";

export type KplPlayer = {
  id: string;
  nickname: string;
  role: PlayerRole;
  /** public 目录下的选手定妆照路径 */
  photoPath: string;
};

export type KplTeam = {
  id: string;
  name: string;
  shortName: string;
  city: string;
  accent: string;
  /** public 目录下的战队图标路径 */
  iconPath: string;
  players: KplPlayer[];
};

/** 页面展示的阵容说明（非官方实时接口） */
export const rosterDisclaimer =
  "选手名单与定妆照参考 2026 王者荣耀挑战者杯公开大名单；具体首发以俱乐部与联盟公布为准。";

export const kplTeams: KplTeam[] = [
  {
    id: "ag",
    name: "成都AG超玩会",
    shortName: "AG",
    city: "成都",
    accent: "#c41e3a",
    iconPath: "/teams/ag.svg",
    players: [
      {
        id: "ag-1",
        nickname: "轩染",
        role: "对抗路",
        photoPath: "/players/ag/xuanchan.jpg",
      },
      {
        id: "ag-2",
        nickname: "钟意",
        role: "打野",
        photoPath: "/players/ag/zhongyi.jpg",
      },
      {
        id: "ag-3",
        nickname: "长生",
        role: "中路",
        photoPath: "/players/ag/changsheng.jpg",
      },
      {
        id: "ag-4",
        nickname: "一诺",
        role: "发育路",
        photoPath: "/players/ag/yinuo.jpg",
      },
      {
        id: "ag-5",
        nickname: "大帅",
        role: "游走",
        photoPath: "/players/ag/dashu.jpg",
      },
    ],
  },
  {
    id: "wolf",
    name: "重庆狼队",
    shortName: "狼队",
    city: "重庆",
    accent: "#f5c518",
    iconPath: "/teams/wolf.svg",
    players: [
      {
        id: "w-1",
        nickname: "清清",
        role: "对抗路",
        photoPath: "/players/wolf/qingqing.jpg",
      },
      {
        id: "w-2",
        nickname: "皖皖",
        role: "打野",
        photoPath: "/players/wolf/huanhuan.jpg",
      },
      {
        id: "w-3",
        nickname: "紫幻",
        role: "中路",
        photoPath: "/players/wolf/zihuan.jpg",
      },
      {
        id: "w-4",
        nickname: "道崽",
        role: "发育路",
        photoPath: "/players/wolf/daozai.jpg",
      },
      {
        id: "w-5",
        nickname: "信",
        role: "游走",
        photoPath: "/players/wolf/xin.jpg",
      },
    ],
  },
  {
    id: "estar",
    name: "武汉eStarPro",
    shortName: "eStar",
    city: "武汉",
    accent: "#00a8e8",
    iconPath: "/teams/estar.svg",
    players: [
      {
        id: "e-1",
        nickname: "Fly",
        role: "对抗路",
        photoPath: "/players/estar/fly.jpg",
      },
      {
        id: "e-2",
        nickname: "小楼",
        role: "打野",
        photoPath: "/players/estar/xiaolou.jpg",
      },
      {
        id: "e-3",
        nickname: "Ming",
        role: "中路",
        photoPath: "/players/estar/ming.jpg",
      },
      {
        id: "e-4",
        nickname: "亮宇",
        role: "发育路",
        photoPath: "/players/estar/liangyu.jpg",
      },
      {
        id: "e-5",
        nickname: "紫渊",
        role: "游走",
        photoPath: "/players/estar/ziyuan.jpg",
      },
    ],
  },
  {
    id: "ttg",
    name: "广州TTG",
    shortName: "TTG",
    city: "广州",
    accent: "#7b68ee",
    iconPath: "/teams/ttg.svg",
    players: [
      {
        id: "t-1",
        nickname: "萝卜",
        role: "对抗路",
        photoPath: "/players/ttg/luobo.jpg",
      },
      {
        id: "t-2",
        nickname: "佳心",
        role: "打野",
        photoPath: "/players/ttg/jiaxin.jpg",
      },
      {
        id: "t-3",
        nickname: "鹤辞",
        role: "中路",
        photoPath: "/players/ttg/hedi.jpg",
      },
      {
        id: "t-4",
        nickname: "小雪",
        role: "发育路",
        photoPath: "/players/ttg/xiaoxue.jpg",
      },
      {
        id: "t-5",
        nickname: "涵",
        role: "游走",
        photoPath: "/players/ttg/han.jpg",
      },
    ],
  },
  {
    id: "wb",
    name: "北京WB",
    shortName: "WB",
    city: "北京",
    accent: "#ff6b35",
    iconPath: "/teams/wb.svg",
    players: [
      {
        id: "wb-1",
        nickname: "梓墨",
        role: "对抗路",
        photoPath: "/players/wb/zimo.jpg",
      },
      {
        id: "wb-2",
        nickname: "暖阳",
        role: "打野",
        photoPath: "/players/wb/nuanyang.jpg",
      },
      {
        id: "wb-3",
        nickname: "听悦",
        role: "中路",
        photoPath: "/players/wb/tingyue.jpg",
      },
      {
        id: "wb-4",
        nickname: "小麦",
        role: "发育路",
        photoPath: "/players/wb/xiaomai.jpg",
      },
      {
        id: "wb-5",
        nickname: "玖欣",
        role: "游走",
        photoPath: "/players/wb/jiuxin.jpg",
      },
    ],
  },
  {
    id: "ksg",
    name: "苏州KSG",
    shortName: "KSG",
    city: "苏州",
    accent: "#2ecc71",
    iconPath: "/teams/ksg.svg",
    players: [
      {
        id: "k-1",
        nickname: "无言",
        role: "对抗路",
        photoPath: "/players/ksg/wuyan.jpg",
      },
      {
        id: "k-2",
        nickname: "句号",
        role: "打野",
        photoPath: "/players/ksg/juhua.jpg",
      },
      {
        id: "k-3",
        nickname: "流浪",
        role: "中路",
        photoPath: "/players/ksg/liulang.jpg",
      },
      {
        id: "k-4",
        nickname: "小屿",
        role: "发育路",
        photoPath: "/players/ksg/xiaoyu.jpg",
      },
      {
        id: "k-5",
        nickname: "一笙",
        role: "游走",
        photoPath: "/players/ksg/yisheng.jpg",
      },
    ],
  },
];

export function getTeamById(id: string): KplTeam | undefined {
  return kplTeams.find((t) => t.id === id);
}
