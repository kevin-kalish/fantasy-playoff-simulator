export function calibrationFromReport(report){
 const latest=report?.calibration?.latestParameters??report?.latestParameters??null;
 if(!latest)return null;
 return {
  positionCV:latest.positionCV??{},
  projectionBuckets:latest.projectionBuckets??{},
  bias:latest.bias??{},
  correlation:latest.correlation??null,
  source:{
   recommendation:report?.calibration?.recommendation??report?.recommendation??null,
   folds:report?.calibration?.folds?.length??report?.folds??null,
   comparison:report?.calibration?.comparison??report?.comparison??null,
   season:latest.season??null,
   week:latest.week??null
  }
 };
}

export function calibrationReady(calibration){
 return !!(calibration&&Object.keys(calibration.projectionBuckets||{}).length&&Object.keys(calibration.bias||{}).length);
}
