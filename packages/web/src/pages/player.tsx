import { NextPage } from 'next';

import { BasePage } from '@app/modules/common/components/BasePage';
import { Player } from '@app/modules/player/layouts/Player';

const PlayerPage: NextPage = () => {
  return (
    <BasePage>
      <Player />
    </BasePage>
  );
};

export default PlayerPage;
