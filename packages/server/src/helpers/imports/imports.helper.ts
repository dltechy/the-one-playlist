import axios from 'axios';
import * as qs from 'qs';

export const axiosSymbol = Symbol.for('axios');
export type AxiosType = typeof axios;

export const qsSymbol = Symbol.for('qs');
export type QsType = typeof qs;
