import type { SummalyPlugin } from '@/iplugin.js';
import * as amazon from './amazon.js';
import * as bluesky from './bluesky.js';
import * as branchIoDeeplinks from './branchio-deeplinks.js';
import * as wikipedia from './wikipedia.js';

export const plugins: SummalyPlugin[] = [amazon, bluesky, wikipedia, branchIoDeeplinks];
