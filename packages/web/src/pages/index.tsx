import { NextPage } from 'next';

import { BasePage } from '@app/modules/common/components/BasePage';
import { Home } from '@app/modules/home/layouts/Home';

const HomePage: NextPage = () => {
  return (
    <BasePage>
      <Home />
    </BasePage>
  );
};

export default HomePage;
