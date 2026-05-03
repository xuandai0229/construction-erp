import { Metadata } from 'next';
import WBSListScreen from './WBSListScreen';

export const metadata: Metadata = {
  title: 'Hạng mục công trình (WBS) | Construction ERP',
  description: 'Quản lý hạng mục công trình và chi phí',
};

export default function WBSPage() {
  return <WBSListScreen />;
}
