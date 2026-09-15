import './styles/index.css';

import { boot, requireApplicationRoot } from './app/boot';

const root = requireApplicationRoot(document);
boot(root);
