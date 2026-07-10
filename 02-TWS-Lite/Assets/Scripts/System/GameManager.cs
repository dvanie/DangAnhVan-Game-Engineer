using UnityEngine;

using TMPro;

using System.Collections.Generic;



public class GameManager : MonoBehaviour

{

    // ================= PLAYER =================

    public Transform player;



    // ================= UI =================

    public TMP_Text inventoryText;

    public TMP_Text collectionText;

    public TMP_Text capacityText;

    public TMP_Text SoulText;

    public TMP_Text miteText;



    // ================= CORE =================

    public int mite;

    public float maxCapacity = 10f;

    private float currentCapacity = 0f;



    // ================= PREFABS =================

    public GameObject slimeSummonPrefab;

    public GameObject wolfSummonPrefab;

    public GameObject goblinSummonPrefab;



    // ================= SYSTEMS =================

    public ArmyManager armyManager;



    // ================= DATA =================

    public List<SoulType> collectedSouls = new List<SoulType>();

    public List<SoulCollectionEntry> soulCollection = new List<SoulCollectionEntry>();

    public List<GameObject> activeShadows = new List<GameObject>();

    public List<SoulData> SoulDatabase = new List<SoulData>();



    // ================= ACTIVE SUMMON TRACKING =================

    private Dictionary<GameObject, SoulData> activeShadowData =

        new Dictionary<GameObject, SoulData>();



    // ================= INIT =================

    private void Start()

    {

        InitializeArmy();

        UpdateAllUI();
        
    }



    private void Update()

    {

        HandleInput();

    }



    // ================= INPUT =================

    private void HandleInput()

    {

        // test summon theo slot activeArmy

        if (Input.GetKeyDown(KeyCode.Alpha1))

            SummonArmyEntryAt(0);



        if (Input.GetKeyDown(KeyCode.Alpha2))

            SummonArmyEntryAt(1);



        if (Input.GetKeyDown(KeyCode.Alpha3))

            SummonArmyEntryAt(2);



        if (Input.GetKeyDown(KeyCode.R))

            RecallAll();
        
        
        // test add collection active army

        if (Input.GetKeyDown(KeyCode.F1))
            TryAddSoulToArmy(SoulType.Wolf, SoulRank.Elite);

        if (Input.GetKeyDown(KeyCode.F2))
            TryAddSoulToArmy(SoulType.Wolf, SoulRank.Leader);

    }



    // ================= ARMY =================

    private void InitializeArmy()

    {

        if (armyManager == null)

        {

            Debug.LogWarning("[GameManager] ArmyManager missing!");

            return;

        }



        armyManager.InitializeDefaultArmy(this);

    }



    private void SummonArmyEntryAt(int index)
    {
        if (armyManager == null)
        {
            Debug.LogWarning("[GameManager] ArmyManager missing!");
            return;
        }

        ArmyEntry entry = armyManager.GetEntryAt(index);

        if (entry == null)
        {
            Debug.Log($"[GameManager] No active army entry at slot {index + 1}");
            return;
        }

        if (!CanSummonArmySlot(index))
        {
            Debug.Log($"[GameManager] Slot {index + 1} is invalid or missing collection/data");
            return;
        }

        SummonSoul(entry);
    }



    // ================= SUMMON =================

    private void SummonSoul(ArmyEntry entry)

    {

        if (entry == null)

            return;



        if (armyManager == null)

        {

            Debug.LogWarning("[GameManager] ArmyManager missing!");

            return;

        }



        if (!armyManager.Contains(entry.soulType, entry.rank))

        {

            Debug.Log($"{entry.soulType} - {entry.rank} is not in active army!");

            return;

        }



        SoulData data = GetSoulData(entry.soulType, entry.rank);

        if (data == null)

        {

            Debug.LogWarning(

                $"[SummonSoul] Missing SoulData for {entry.soulType} - {entry.rank}"

            );

            return;

        }



        if (!CanSummon(data))

            return;



        GameObject prefab = GetSummonPrefab(entry.soulType);

        if (prefab == null)

        {

            Debug.LogWarning($"[SummonSoul] Missing summon prefab for {entry.soulType}");

            return;

        }



        Vector3 spawnOffset = new Vector3(

            Random.Range(-2f, 2f),

            1f,

            Random.Range(-2f, 2f)

        );



        GameObject summon =

            Instantiate(prefab, player.position + spawnOffset, Quaternion.identity);



        InitializeSummonStats(summon, entry);



        RegisterActiveShadow(summon, data);

        ApplySummonFollow(summon);



        currentCapacity += data.capacityCost;

        UpdateCapacityUI();



        Debug.Log($"{entry.soulType} - {entry.rank} Summoned! Cost = {data.capacityCost}");

    }



    private void InitializeSummonStats(GameObject summon, ArmyEntry entry)

    {

        SoulStats soulStats = summon.GetComponent<SoulStats>();



        if (soulStats == null)

        {

            Debug.LogWarning("[GameManager] Summon prefab missing SoulStats component!");

            return;

        }



        soulStats.Initialize(entry.soulType, entry.rank);

    }



    private GameObject GetSummonPrefab(SoulType type)

    {

        switch (type)

        {

            case SoulType.Slime:

                return slimeSummonPrefab;



            case SoulType.Wolf:

                return wolfSummonPrefab;



            case SoulType.Goblin:

                return goblinSummonPrefab;

        }



        return null;

    }



    private bool CanSummon(SoulData data)

    {

        // Capacity check

        if (currentCapacity + data.capacityCost > maxCapacity)

        {

            Debug.Log("Capacity Full!");

            return false;

        }



        // Unique summon rules

        if (data.rank == SoulRank.Leader && HasActiveLeader())

        {

            Debug.Log("Leader already active!");

            return false;

        }



        if (data.rank == SoulRank.Boss && HasActiveBoss())

        {

            Debug.Log("Boss already active!");

            return false;

        }



        return true;

    }



    private void RegisterActiveShadow(GameObject summon, SoulData data)

    {

        activeShadows.Add(summon);

        activeShadowData[summon] = data;

    }



    private void ApplySummonFollow(GameObject summon)

    {

        SummonFollow follow = summon.GetComponent<SummonFollow>();



        if (follow != null)

        {

            follow.followOffset = new Vector3(

                Random.Range(-2f, 2f),

                0f,

                Random.Range(-2f, 2f)

            );

        }

    }



    // ================= ACTIVE RANK CHECK =================

    private bool HasActiveLeader()

    {

        foreach (var pair in activeShadowData)

        {

            if (pair.Key == null) continue;

            if (pair.Value == null) continue;



            if (pair.Value.rank == SoulRank.Leader)

                return true;

        }



        return false;

    }



    private bool HasActiveBoss()

    {

        foreach (var pair in activeShadowData)

        {

            if (pair.Key == null) continue;

            if (pair.Value == null) continue;



            if (pair.Value.rank == SoulRank.Boss)

                return true;

        }



        return false;

    }



    // ================= CAPACITY =================

    private void UpdateCapacityUI()

    {

        if (capacityText == null) return;



        capacityText.text =

            "Capacity: " +

            FormatCapacity(currentCapacity) +

            "/" +

            FormatCapacity(maxCapacity);

    }



    private string FormatCapacity(float value)

    {

        if (Mathf.Approximately(value % 1f, 0f))

            return ((int)value).ToString();



        return value.ToString("0.0");

    }



    // ================= SOUL DATABASE =================

    public SoulData GetSoulData(SoulType type, SoulRank rank)

    {

        foreach (SoulData data in SoulDatabase)

        {

            if (data.SoulType == type && data.rank == rank)

                return data;

        }



        return null;

    }



    // backward helper nếu chỗ nào cũ còn gọi theo type

    public SoulData GetSoulData(SoulType type)

    {

        foreach (SoulData data in SoulDatabase)

        {

            if (data.SoulType == type)

                return data;

        }



        return null;

    }



    // ================= COLLECTION CHECK =================

    public bool HasSoulInCollection(SoulType type, SoulRank rank)

    {

        SoulCollectionEntry entry = GetCollectionEntry(type);

        if (entry == null)

            return false;



        switch (rank)

        {

            case SoulRank.Elite:

                return entry.eliteCount > 0;



            case SoulRank.Leader:

                return entry.hasLeader;



            case SoulRank.Boss:

                return entry.hasBoss;



            // nếu sau này muốn cho Common summon thì xử lý tại đây

            default:

                return false;

        }

    }
    
    
            // ================= COLLECTION -> ACTIVE ARMY API =================

        public bool TryAddSoulToArmy(SoulType type, SoulRank rank)
        {
            if (armyManager == null)
            {
                Debug.LogWarning("[GameManager] TryAddSoulToArmy failed: ArmyManager missing");
                return false;
            }

            if (!HasSoulInCollection(type, rank))
            {
                Debug.Log($"[GameManager] Cannot add {type} - {rank} to army because collection does not have it");
                return false;
            }

            ArmyEntry entry = new ArmyEntry
            {
                soulType = type,
                rank = rank
            };

            bool result = armyManager.TryAddArmyEntry(entry, this, true);

            if (result)
            {
                Debug.Log($"[GameManager] Added {type} - {rank} to active army");
            }

            return result;
        }

        public bool TrySetSoulToArmySlot(int slotIndex, SoulType type, SoulRank rank)
        {
            if (armyManager == null)
            {
                Debug.LogWarning("[GameManager] TrySetSoulToArmySlot failed: ArmyManager missing");
                return false;
            }

            if (!HasSoulInCollection(type, rank))
            {
                Debug.Log($"[GameManager] Cannot set slot {slotIndex + 1} with {type} - {rank} because collection does not have it");
                return false;
            }

            ArmyEntry entry = new ArmyEntry
            {
                soulType = type,
                rank = rank
            };

            bool result = armyManager.SetArmyEntryAt(slotIndex, entry, this, true);

            if (result)
            {
                Debug.Log($"[GameManager] Set slot {slotIndex + 1} = {type} - {rank}");
            }

            return result;
        }

        public bool TryRemoveSoulFromArmy(SoulType type, SoulRank rank)
        {
            if (armyManager == null)
            {
                Debug.LogWarning("[GameManager] TryRemoveSoulFromArmy failed: ArmyManager missing");
                return false;
            }

            bool result = armyManager.RemoveArmyEntry(type, rank, true);

            if (result)
            {
                Debug.Log($"[GameManager] Removed {type} - {rank} from active army");
            }

            return result;
        }

        public bool TryRemoveSoulFromArmySlot(int slotIndex)
        {
            if (armyManager == null)
            {
                Debug.LogWarning("[GameManager] TryRemoveSoulFromArmySlot failed: ArmyManager missing");
                return false;
            }

            ArmyEntry current = armyManager.GetEntryAt(slotIndex);
            if (current == null)
            {
                Debug.Log($"[GameManager] Slot {slotIndex + 1} already empty");
                return false;
            }

            bool result = armyManager.ClearArmyEntryAt(slotIndex, true);

            if (result)
            {
                Debug.Log($"[GameManager] Cleared slot {slotIndex + 1}");
            }

            return result;
        }

        public bool CanSummonArmySlot(int slotIndex)
        {
            if (armyManager == null)
                return false;

            ArmyEntry entry = armyManager.GetEntryAt(slotIndex);
            if (entry == null)
                return false;

            if (!HasSoulInCollection(entry.soulType, entry.rank))
                return false;

            SoulData data = GetSoulData(entry.soulType, entry.rank);
            if (data == null)
                return false;

            return true;
        }

    // ================= BACKWARD COMPATIBILITY API =================

    public void AddSoul(SoulType type, SoulRank rank)
    {
        // ================= COMMON = AUTO CONVERT TO MITE =================
        if (rank == SoulRank.Common)
        {
            AddMite(1);

            Debug.Log($"[AddSoul] Common {type} converted to 1 mite");

            UpdateSoulUI();
            UpdateInventoryUI();
            UpdateCollectionUI();
            return;
        }

        // ================= NON-COMMON MUST EXIST IN DATABASE =================
        SoulData data = GetSoulData(type, rank);

        if (data == null)
        {
            Debug.LogWarning($"[AddSoul] Missing SoulData: {type} - {rank}");
            return;
        }

        collectedSouls.Add(type);
        AddToCollection(type, rank);

        // Sau khi collection đổi -> lọc lại active army
        if (armyManager != null)
        {
            armyManager.FilterInvalidArmyEntries(this);
            armyManager.UpdateArmyUI();
        }

        UpdateSoulUI();
        UpdateInventoryUI();
        UpdateCollectionUI();

        Debug.Log($"[AddSoul] Added {type} - {rank}");
    }

    
    public void AddMite(int amount)

    {

        mite += amount;



        if (miteText != null)

            miteText.text = "Mite: " + mite;

    }



    // ================= COLLECTION =================

    private void AddToCollection(SoulType type, SoulRank rank)

    {

        SoulCollectionEntry entry = GetCollectionEntry(type);



        if (entry == null)

        {

            entry = new SoulCollectionEntry();

            entry.soulType = type;

            soulCollection.Add(entry);

        }



        if (rank == SoulRank.Elite)

            entry.eliteCount++;

        else if (rank == SoulRank.Leader)

            entry.hasLeader = true;

        else if (rank == SoulRank.Boss)

            entry.hasBoss = true;

    }



    private SoulCollectionEntry GetCollectionEntry(SoulType type)

    {

        foreach (SoulCollectionEntry entry in soulCollection)

        {

            if (entry.soulType == type)

                return entry;

        }



        return null;

    }



    // ================= RECALL =================

    private void RecallAll()

    {

        foreach (GameObject shadow in activeShadows)

        {

            if (shadow != null)

                Destroy(shadow);

        }



        activeShadows.Clear();

        activeShadowData.Clear();

        currentCapacity = 0f;



        UpdateCapacityUI();



        Debug.Log("All Shadows Recalled!");

    }



    public void OnShadowDefeated(GameObject shadow)

    {

        if (shadow == null)

            return;



        activeShadows.Remove(shadow);



        if (activeShadowData.TryGetValue(shadow, out SoulData data))

        {

            currentCapacity -= data.capacityCost;

            activeShadowData.Remove(shadow);

        }

        else

        {

            // fallback an toàn nếu shadow không được register đúng

            currentCapacity = Mathf.Max(0f, currentCapacity - 1f);

        }



        if (currentCapacity < 0f)

            currentCapacity = 0f;



        UpdateCapacityUI();



        Debug.Log("Shadow Defeated!");

    }



    // ================= UI =================

    private void UpdateAllUI()

    {

        UpdateCapacityUI();

        UpdateSoulUI();

        UpdateInventoryUI();

        UpdateCollectionUI();



        if (armyManager != null)

            armyManager.UpdateArmyUI();

    }



    private void UpdateSoulUI()

    {

        if (SoulText != null)

            SoulText.text = "Soul: " + collectedSouls.Count;



        if (miteText != null)

            miteText.text = "Mite: " + mite;

    }



    private void UpdateInventoryUI()

    {

        if (inventoryText == null) return;



        inventoryText.text = "Collected Souls\n";



        int slime = 0;

        int wolf = 0;

        int goblin = 0;



        foreach (SoulType soul in collectedSouls)

        {

            if (soul == SoulType.Slime) slime++;

            else if (soul == SoulType.Wolf) wolf++;

            else if (soul == SoulType.Goblin) goblin++;

        }



        if (slime > 0) inventoryText.text += "Slime x" + slime + "\n";

        if (wolf > 0) inventoryText.text += "Wolf x" + wolf + "\n";

        if (goblin > 0) inventoryText.text += "Goblin x" + goblin + "\n";

    }



    private void UpdateCollectionUI()

    {

        if (collectionText == null) return;



        collectionText.text = "Soul Collection\n";



        foreach (SoulCollectionEntry entry in soulCollection)

        {

            collectionText.text +=

                entry.soulType + "\n" +

                "Elite: " + entry.eliteCount + "\n" +

                "Leader: " + entry.hasLeader + "\n" +

                "Boss: " + entry.hasBoss + "\n\n";

        }

    }

}