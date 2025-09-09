import CollectionsList from '../CollectionsList';

export default function CollectionPage() {
  return (
    <div className="flex flex-col w-full flex-1 gap-4 p-4">
      <h1 className="text-2xl font-bold text-white text-center mt-2">
        あなたの書目
      </h1>

      <CollectionsList />
    </div>
  );
}