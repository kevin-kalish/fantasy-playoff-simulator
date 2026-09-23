export const MODEL_VARIANTS={
 baseline:{id:'baseline',label:'Projection only',playerVolatility:false,availability:false,correlation:false,horizonUncertainty:false},
 volatility:{id:'volatility',label:'Projection + volatility',playerVolatility:true,availability:false,correlation:false,horizonUncertainty:false},
 availability:{id:'availability',label:'Volatility + availability',playerVolatility:true,availability:true,correlation:false,horizonUncertainty:true},
 correlated:{id:'correlated',label:'Full correlated model',playerVolatility:true,availability:true,correlation:true,horizonUncertainty:true}
};
export function getModelVariant(id='correlated'){const v=MODEL_VARIANTS[id];if(!v)throw new Error(`Unknown model variant: ${id}`);return v}
