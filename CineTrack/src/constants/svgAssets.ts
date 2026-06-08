import type { SvgProps } from 'react-native-svg';
import SplashImage from '../assets/splash_image.svg';
import HomeIcon from '../assets/home_unselected.svg';
import BookmarkIcon from '../assets/bookmark_unselected.svg';
import SearchIcon from '../assets/search_unselected.svg';

export const SVG_IMAGES = {
  splashImage: SplashImage,
  home: HomeIcon,
  bookmark: BookmarkIcon,
  search: SearchIcon,
} as const satisfies Record<string, React.FC<SvgProps>>;

export type SvgImageName = keyof typeof SVG_IMAGES;