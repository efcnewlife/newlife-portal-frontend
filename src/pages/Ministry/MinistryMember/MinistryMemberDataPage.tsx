import { Resource } from "@/const/enums";
import StewardDetailPane from "./StewardDetailPane";
import StewardDirectoryFilters from "./StewardDirectoryFilters";
import StewardDirectoryRail from "./StewardDirectoryRail";
import StewardUnsavedModal from "./StewardUnsavedModal";
import { useStewardDirectoryPage } from "./useStewardDirectoryPage";
import { useStewardSplitWidth } from "./useStewardSplitWidth";

const MinistryMemberDataPage = () => {
  const page = useStewardDirectoryPage();
  const { railWidth, startResize } = useStewardSplitWidth();

  return (
    <div
      data-resource={Resource.MinistryMember}
      className="h-full flex flex-col rounded-xl border border-gray-100 dark:border-white/[0.05] bg-white dark:bg-white/[0.03] overflow-hidden"
    >
      <StewardDirectoryFilters
        query={page.query}
        onQueryChange={page.setQuery}
        statusFilter={page.statusFilter}
        onStatusFilterChange={page.setStatusFilter}
        statusOptions={page.statusOptions}
      />
      <div className="flex-1 min-h-0 flex">
        <StewardDirectoryRail
          items={page.railItems}
          selectedId={page.selectedId}
          loading={page.loadingRail}
          width={railWidth}
          sort={page.sort}
          onSortFieldClick={page.handleSortFieldClick}
          onSelect={page.handleRailClick}
        />
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize directory pane"
          tabIndex={0}
          className="w-1 shrink-0 cursor-col-resize bg-gray-100 hover:bg-brand-500/40 active:bg-brand-500/50 dark:bg-white/[0.05] dark:hover:bg-brand-400/40"
          onPointerDown={startResize}
        />
        <StewardDetailPane
          selectedId={page.selectedId}
          ministry={page.selectedMinistry}
          railItem={page.railItems.find((item) => item.id === page.selectedId) || null}
          loadingRoster={page.loadingRoster}
          isEditing={page.isEditing}
          canModify={page.canModify}
          members={page.members}
          onMembersChange={page.setMembers}
          memberError={page.memberError}
          ownerPositionLabel={page.ownerPositionLabel}
          ownerPositionIncumbent={page.ownerPositionIncumbent}
          ownerPositionId={page.ownerPositionId}
          saving={page.saving}
          onEnterEdit={page.enterEdit}
          onCancelEdit={page.cancelEdit}
          onSave={() => void page.save()}
        />
      </div>
      <StewardUnsavedModal
        isOpen={page.unsavedOpen}
        canModify={page.canModify}
        onClose={page.closeUnsaved}
        onDiscard={() => void page.discardUnsaved()}
        onSave={() => void page.saveUnsaved()}
      />
    </div>
  );
};

export default MinistryMemberDataPage;
