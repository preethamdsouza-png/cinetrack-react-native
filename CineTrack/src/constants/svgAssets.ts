import type { SvgProps } from 'react-native-svg';
import SplashImage from '../assets/splash_image.svg';
import HomeIcon from '../assets/home_unselected.svg';
import BookmarkIcon from '../assets/bookmark_unselected.svg';
import SearchIcon from '../assets/search_unselected.svg';
import WatchListIcon from '../assets/watchlist.svg';
import NoResults from '../assets/no-results.svg';
import ArrowLeft from '../assets/arrow-left.svg';
import Scan from '../assets/scan.svg';
import BookMarkSelected from '../assets/bookmark_selected.svg';
import BookMarkUnSelected from '../assets/bookmark_unselected.svg';




export const SVG_IMAGES = {
  splashImage: SplashImage,
  home: HomeIcon,
  bookmark: BookmarkIcon,
  watchlist:WatchListIcon,
  search: SearchIcon,
  noResults: NoResults,
  arrowLeft:ArrowLeft,
  scan:Scan,
  bookmarkSelected:BookMarkSelected,
  BookMarkUnSelected:BookMarkUnSelected
} as const satisfies Record<string, React.FC<SvgProps>>;

export type SvgImageName = keyof typeof SVG_IMAGES;