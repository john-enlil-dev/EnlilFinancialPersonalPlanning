import LongTermContainersSection from './long-term-containers-section';
import LongTermItemsSection from './long-term-items-section';

export default function LongTermTab() {
  return (
    <div>
      <LongTermContainersSection />
      <hr className="my-4" />
      <LongTermItemsSection />
    </div>
  );
}
