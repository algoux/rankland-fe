/**
 * This module was automatically generated by `ts-interface-builder`
 */
import * as t from "ts-interface-checker";
// tslint:disable:object-literal-key-quotes

export const Type = t.lit('general');

export const Version = t.lit('0.3.4');

export const DatetimeISOString = t.name("string");

export const TimeUnit = t.union(t.lit('ms'), t.lit('s'), t.lit('min'), t.lit('h'), t.lit('d'));

export const TimeDuration = t.tuple("number", "TimeUnit");

export const I18NStringSet = t.iface([], {
  "fallback": "string",
  [t.indexKey]: "string",
});

export const Text = t.union("string", "I18NStringSet");

export const Link = t.name("string");

export const LinkWithTitle = t.iface([], {
  "link": "Link",
  "title": "Text",
});

export const Base64 = t.name("string");

export const Image = t.union("Link", "Base64");

export const ImageWithLink = t.iface([], {
  "image": "Image",
  "link": "Link",
});

export const ColorHEX = t.name("string");

export const ColorRGB = t.name("string");

export const ColorRGBA = t.name("string");

export const Color = t.union("ColorHEX", "ColorRGB", "ColorRGBA");

export const ThemeColor = t.union("Color", t.iface([], {
  "light": "Color",
  "dark": "Color",
}));

export const Style = t.iface([], {
  "textColor": t.opt("ThemeColor"),
  "backgroundColor": t.opt("ThemeColor"),
});

export const Contributor = t.name("string");

export const ExternalUser = t.iface([], {
  "name": "Text",
  "avatar": t.opt("Image"),
  "link": t.opt("string"),
});

export const User = t.iface([], {
  "id": "string",
  "name": "Text",
  "official": t.opt("boolean"),
  "avatar": t.opt("Image"),
  "organization": t.opt("Text"),
  "teamMembers": t.opt(t.array("ExternalUser")),
  "marker": t.opt("string"),
});

export const ProblemStatistics = t.iface([], {
  "accepted": "number",
  "submitted": "number",
});

export const Problem = t.iface([], {
  "title": t.opt("Text"),
  "alias": t.opt("string"),
  "link": t.opt("Link"),
  "statistics": t.opt("ProblemStatistics"),
  "style": t.opt("Style"),
});

export const SolutionResultLite = t.union(t.lit('FB'), t.lit('AC'), t.lit('RJ'), t.lit('?'), "null");

export const SolutionResultFull = t.union("SolutionResultLite", t.lit('WA'), t.lit('PE'), t.lit('TLE'), t.lit('MLE'), t.lit('OLE'), t.lit('RTE'), t.lit('NOUT'), t.lit('CE'), t.lit('UKE'));

export const SolutionResultCustom = t.name("string");

export const Solution = t.iface([], {
  "result": "string",
  "score": t.opt("number"),
  "time": "TimeDuration",
  "link": t.opt("Link"),
});

export const Contest = t.iface([], {
  "title": "Text",
  "startAt": "DatetimeISOString",
  "duration": "TimeDuration",
  "frozenDuration": t.opt("TimeDuration"),
  "banner": t.opt(t.union("Image", "ImageWithLink")),
  "refLinks": t.opt(t.array("LinkWithTitle")),
});

export const RankSeriesSegmentStylePreset = t.union(t.lit('gold'), t.lit('silver'), t.lit('bronze'), t.lit('iron'));

export const RankSeriesSegment = t.iface([], {
  "title": t.opt("string"),
  "style": t.opt(t.union("Style", "RankSeriesSegmentStylePreset")),
});

export const RankSeriesRulePresetNormal = t.iface([], {
  "preset": t.lit('Normal'),
  "options": t.opt(t.iface([], {
    "includeOfficialOnly": t.opt("boolean"),
  })),
});

export const RankSeriesRulePresetUniqByUserField = t.iface([], {
  "preset": t.lit('UniqByUserField'),
  "options": t.iface([], {
    "field": t.union(t.lit('id'), t.lit('name'), t.lit('official'), t.lit('avatar'), t.lit('organization'), t.lit('teamMembers'), t.lit('marker')),
    "includeOfficialOnly": t.opt("boolean"),
  }),
});

export const RankSeriesRulePresetICPC = t.iface([], {
  "preset": t.lit('ICPC'),
  "options": t.iface([], {
    "ratio": t.opt(t.iface([], {
      "value": t.array("number"),
      "rounding": t.opt(t.union(t.lit('floor'), t.lit('ceil'), t.lit('round'))),
      "denominator": t.opt(t.union(t.lit('all'), t.lit('submitted'))),
      "noTied": t.opt("boolean"),
    })),
    "count": t.opt(t.iface([], {
      "value": t.array("number"),
      "noTied": t.opt("boolean"),
    })),
    "filter": t.opt(t.iface([], {
      "byUserFields": t.opt(t.array(t.iface([], {
        "field": t.union(t.lit('id'), t.lit('name'), t.lit('official'), t.lit('avatar'), t.lit('organization'), t.lit('teamMembers'), t.lit('marker')),
        "rule": "string",
      }))),
    })),
  }),
});

export const RankSeriesRulePreset = t.union("RankSeriesRulePresetNormal", "RankSeriesRulePresetUniqByUserField", "RankSeriesRulePresetICPC");

export const RankSeries = t.iface([], {
  "title": t.opt("string"),
  "segments": t.opt(t.array("RankSeriesSegment")),
  "rule": t.opt("RankSeriesRulePreset"),
});

export const RankScore = t.iface([], {
  "value": "number",
  "time": t.opt("TimeDuration"),
});

export const RankProblemStatus = t.iface([], {
  "result": "SolutionResultLite",
  "score": t.opt("number"),
  "time": t.opt("TimeDuration"),
  "tries": t.opt("number"),
  "solutions": t.opt(t.array("Solution")),
});

export const RanklistRow = t.iface([], {
  "user": "User",
  "score": "RankScore",
  "statuses": t.array("RankProblemStatus"),
});

export const MarkerStylePreset = t.union(t.lit('red'), t.lit('orange'), t.lit('yellow'), t.lit('green'), t.lit('blue'), t.lit('purple'), t.lit('pink'));

export const Marker = t.iface([], {
  "id": "string",
  "label": "Text",
  "style": t.union("Style", "MarkerStylePreset"),
});

export const SorterBase = t.iface([], {
});

export const SorterICPC = t.iface(["SorterBase"], {
  "algorithm": t.lit('ICPC'),
  "config": t.iface([], {
    "penalty": t.opt("TimeDuration"),
    "noPenaltyResults": t.opt(t.array("SolutionResultFull")),
    "timePrecision": t.opt("TimeUnit"),
    "timeRounding": t.opt(t.union(t.lit('floor'), t.lit('ceil'), t.lit('round'))),
  }),
});

export const SorterScore = t.iface(["SorterBase"], {
  "algorithm": t.lit('score'),
  "config": "any",
});

export const Sorter = t.union("SorterICPC", "SorterScore");

export const Ranklist = t.iface([], {
  "type": t.union("Type", "string"),
  "version": t.union("Version", "string"),
  "contest": "Contest",
  "problems": t.array("Problem"),
  "series": t.array("RankSeries"),
  "rows": t.array("RanklistRow"),
  "markers": t.opt(t.array("Marker")),
  "sorter": t.opt("Sorter"),
  "contributors": t.opt(t.array("Contributor")),
  "remarks": t.opt("Text"),
  "_now": t.opt("DatetimeISOString"),
});

const exportedTypeSuite: t.ITypeSuite = {
  Type,
  Version,
  DatetimeISOString,
  TimeUnit,
  TimeDuration,
  I18NStringSet,
  Text,
  Link,
  LinkWithTitle,
  Base64,
  Image,
  ImageWithLink,
  ColorHEX,
  ColorRGB,
  ColorRGBA,
  Color,
  ThemeColor,
  Style,
  Contributor,
  ExternalUser,
  User,
  ProblemStatistics,
  Problem,
  SolutionResultLite,
  SolutionResultFull,
  SolutionResultCustom,
  Solution,
  Contest,
  RankSeriesSegmentStylePreset,
  RankSeriesSegment,
  RankSeriesRulePresetNormal,
  RankSeriesRulePresetUniqByUserField,
  RankSeriesRulePresetICPC,
  RankSeriesRulePreset,
  RankSeries,
  RankScore,
  RankProblemStatus,
  RanklistRow,
  MarkerStylePreset,
  Marker,
  SorterBase,
  SorterICPC,
  SorterScore,
  Sorter,
  Ranklist,
};
export default exportedTypeSuite;
