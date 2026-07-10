using System.Collections.Generic;

using UnityEngine;

using TMPro;



public class ArmyManager : MonoBehaviour

{

    public TMP_Text activeArmyText;



    [Header("Army Rules")]

    public int maxArmySlots = 3;



    // fixed slot army: index = slot

    public List<ArmyEntry> activeArmy = new List<ArmyEntry>();



    private void Awake()

    {

        EnsureArmySlotSize();

    }



    // ================= SLOT SETUP =================

    private void EnsureArmySlotSize()

    {

        if (activeArmy == null)

            activeArmy = new List<ArmyEntry>();



        while (activeArmy.Count < maxArmySlots)

            activeArmy.Add(null);



        while (activeArmy.Count > maxArmySlots)

            activeArmy.RemoveAt(activeArmy.Count - 1);

    }



    // ================= UI =================

    public void UpdateArmyUI()

    {

        EnsureArmySlotSize();



        if (activeArmyText == null) return;



        activeArmyText.text = "Active Army\n";



        for (int i = 0; i < activeArmy.Count; i++)

        {

            ArmyEntry entry = activeArmy[i];



            if (entry == null)

            {

                activeArmyText.text += $"[{i + 1}] Empty\n";

            }

            else

            {

                activeArmyText.text += $"[{i + 1}] {entry.soulType} - {entry.rank}\n";

            }

        }

    }



    // ================= QUERY =================

    public bool Contains(SoulType type, SoulRank rank)

    {

        EnsureArmySlotSize();



        foreach (ArmyEntry entry in activeArmy)

        {

            if (entry == null) continue;



            if (entry.soulType == type && entry.rank == rank)

                return true;

        }



        return false;

    }



    public ArmyEntry GetEntryAt(int index)

    {

        EnsureArmySlotSize();



        if (index < 0 || index >= activeArmy.Count)

            return null;



        return activeArmy[index];

    }



    public bool HasEmptySlot()

    {

        EnsureArmySlotSize();



        for (int i = 0; i < activeArmy.Count; i++)

        {

            if (activeArmy[i] == null)

                return true;

        }



        return false;

    }



    public int GetFirstEmptySlot()

    {

        EnsureArmySlotSize();



        for (int i = 0; i < activeArmy.Count; i++)

        {

            if (activeArmy[i] == null)

                return i;

        }



        return -1;

    }



    public bool IsFull()

    {

        return GetFirstEmptySlot() == -1;

    }



    // ================= DEFAULT INIT =================

    public void InitializeDefaultArmy(GameManager gameManager)

    {

        EnsureArmySlotSize();



        if (gameManager == null)

        {

            Debug.LogWarning("[ArmyManager] Missing GameManager in InitializeDefaultArmy");

            return;

        }



        // Nếu army đã có ít nhất 1 slot có dữ liệu thì không auto add default nữa

        bool hasAnyEntry = false;

        foreach (ArmyEntry entry in activeArmy)

        {

            if (entry != null)

            {

                hasAnyEntry = true;

                break;

            }

        }



        if (hasAnyEntry)

        {

            FilterInvalidArmyEntries(gameManager);

            UpdateArmyUI();

            return;

        }



        // ===== Default entries =====

        TryAddArmyEntry(

            new ArmyEntry

            {

                soulType = SoulType.Slime,

                rank = SoulRank.Elite

            },

            gameManager,

            false

        );



        TryAddArmyEntry(

            new ArmyEntry

            {

                soulType = SoulType.Wolf,

                rank = SoulRank.Leader

            },

            gameManager,

            false

        );



        UpdateArmyUI();

    }



    // ================= VALIDATION =================

    public bool CanUseArmyEntry(ArmyEntry entry, GameManager gameManager)

    {

        if (entry == null)

            return false;



        if (gameManager == null)

            return false;



        return gameManager.HasSoulInCollection(entry.soulType, entry.rank);

    }



    // ================= ADD / REMOVE =================

    public bool TryAddArmyEntry(

        ArmyEntry entry,

        GameManager gameManager,

        bool updateUI = true

    )

    {

        EnsureArmySlotSize();



        if (entry == null)

        {

            Debug.LogWarning("[ArmyManager] TryAddArmyEntry failed: entry null");

            return false;

        }



        if (gameManager == null)

        {

            Debug.LogWarning("[ArmyManager] TryAddArmyEntry failed: gameManager null");

            return false;

        }



        if (Contains(entry.soulType, entry.rank))

        {

            Debug.Log($"[ArmyManager] {entry.soulType} - {entry.rank} already exists in active army");

            return false;

        }



        if (!CanUseArmyEntry(entry, gameManager))

        {

            Debug.Log($"[ArmyManager] Cannot add {entry.soulType} - {entry.rank} because collection does not have it");

            return false;

        }



        int emptySlot = GetFirstEmptySlot();

        if (emptySlot == -1)

        {

            Debug.Log("[ArmyManager] Active army is full");

            return false;

        }



        activeArmy[emptySlot] = new ArmyEntry

        {

            soulType = entry.soulType,

            rank = entry.rank

        };



        if (updateUI)

            UpdateArmyUI();



        return true;

    }



    public bool SetArmyEntryAt(

        int index,

        ArmyEntry entry,

        GameManager gameManager,

        bool updateUI = true

    )

    {

        EnsureArmySlotSize();



        if (index < 0 || index >= activeArmy.Count)

        {

            Debug.LogWarning("[ArmyManager] SetArmyEntryAt failed: invalid index");

            return false;

        }



        if (entry == null)

        {

            Debug.LogWarning("[ArmyManager] SetArmyEntryAt failed: entry null");

            return false;

        }



        if (gameManager == null)

        {

            Debug.LogWarning("[ArmyManager] SetArmyEntryAt failed: gameManager null");

            return false;

        }



        if (!CanUseArmyEntry(entry, gameManager))

        {

            Debug.Log($"[ArmyManager] Cannot set slot {index} with {entry.soulType} - {entry.rank} because collection does not have it");

            return false;

        }



        // chặn duplicate ở slot khác

        for (int i = 0; i < activeArmy.Count; i++)

        {

            if (i == index) continue;



            ArmyEntry current = activeArmy[i];

            if (current == null) continue;



            if (current.soulType == entry.soulType && current.rank == entry.rank)

            {

                Debug.Log($"[ArmyManager] {entry.soulType} - {entry.rank} already exists in another slot");

                return false;

            }

        }



        activeArmy[index] = new ArmyEntry

        {

            soulType = entry.soulType,

            rank = entry.rank

        };



        if (updateUI)

            UpdateArmyUI();



        return true;

    }



    public bool ClearArmyEntryAt(int index, bool updateUI = true)

    {

        EnsureArmySlotSize();



        if (index < 0 || index >= activeArmy.Count)

            return false;



        activeArmy[index] = null;



        if (updateUI)

            UpdateArmyUI();



        return true;

    }



    public bool RemoveArmyEntry(SoulType type, SoulRank rank, bool updateUI = true)

    {

        EnsureArmySlotSize();



        for (int i = 0; i < activeArmy.Count; i++)

        {

            ArmyEntry entry = activeArmy[i];

            if (entry == null) continue;



            if (entry.soulType == type && entry.rank == rank)

            {

                activeArmy[i] = null;



                if (updateUI)

                    UpdateArmyUI();



                return true;

            }

        }



        return false;

    }



    public void ClearArmy(bool updateUI = true)

    {

        EnsureArmySlotSize();



        for (int i = 0; i < activeArmy.Count; i++)

        {

            activeArmy[i] = null;

        }



        if (updateUI)

            UpdateArmyUI();

    }



    // ================= FILTER =================

    public void FilterInvalidArmyEntries(GameManager gameManager)

    {

        EnsureArmySlotSize();



        if (gameManager == null)

            return;



        for (int i = 0; i < activeArmy.Count; i++)

        {

            ArmyEntry entry = activeArmy[i];



            if (entry == null)

                continue;



            if (!CanUseArmyEntry(entry, gameManager))

            {

                Debug.Log($"[ArmyManager] Removed invalid army entry: {entry.soulType} - {entry.rank}");

                activeArmy[i] = null;

            }

        }

    }

}