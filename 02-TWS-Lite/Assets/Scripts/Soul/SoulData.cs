using UnityEngine;

[System.Serializable]
public class SoulData
{
    [Header("Identity")]
    public SoulType SoulType;
    public SoulRank rank;
    public ShadowClass ShadowClass;

    [Header("Combat Stats")]
    public int attackDamage;
    public int maxHealth;
    public float attackCooldown;
    public float moveSpeed;
    public float attackRange;

    [Header("Summon Rules")]
    public float capacityCost = 1f;
}