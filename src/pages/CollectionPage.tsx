import CollectionsList from '../CollectionsList';

export default function CollectionPage() {
  return (
    <div className="flex flex-col w-full gap-4 p-4">
      <h1 className="text-2xl font-bold text-white text-center mt-2">
        マイコレクション
      </h1>

      <div className="bg-white rounded-lg shadow-lg p-4">
        <CollectionsList />
      </div>
    </div>
  );
}