import { NextPage } from 'next';
import { useEffect } from 'react';

const Close: NextPage = () => {
  // Effects

  useEffect(() => {
    window.opener.location.reload(false);
    window.close();
  }, []);

  // Element

  return null;
};

export default Close;
