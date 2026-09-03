import { motion } from 'framer-motion';

import * as Layout from './layout.js';

export const Animated = () => (
  <Layout.Row>
    <motion.div animate={{ opacity: 1 }} />
  </Layout.Row>
);
