import type { SvgProps } from 'react-native-svg';
import SplashImage from '../assets/splash_image.svg';
import HomeIcon from '../assets/home_unselected.svg';
import BookmarkIcon from '../assets/bookmark_unselected.svg';
import SearchIcon from '../assets/search_unselected.svg';
import NoResults from '../assets/no-results.svg';
import ArrowLeft from '../assets/arrow-left.svg';
import Scan from '../assets/scan.svg';



export const SVG_IMAGES = {
  splashImage: SplashImage,
  home: HomeIcon,
  bookmark: BookmarkIcon,
  search: SearchIcon,
  noResults: NoResults,
  arrowLeft:ArrowLeft,
  scan:Scan
} as const satisfies Record<string, React.FC<SvgProps>>;

export type SvgImageName = keyof typeof SVG_IMAGES;