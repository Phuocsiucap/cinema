import { useAds } from '../contexts/AdsContext';
import { AdsModal } from '../components/ui';

const AdsModalWrapper = () => {
  const { showAdsModal, posterAds, closeAdsModal } = useAds();

  return (
    <AdsModal
      isOpen={showAdsModal}
      onClose={closeAdsModal}
      posterAds={posterAds}
    />
  );
};

export default AdsModalWrapper;