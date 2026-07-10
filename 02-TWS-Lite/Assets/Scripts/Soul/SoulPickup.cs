using UnityEngine;

public class SoulPickup : MonoBehaviour
{
    public SoulType SoulType;

    public SoulRank soulRank;

    private GameManager gameManager;

    private void Start()
    {
        gameManager =
            FindAnyObjectByType<GameManager>();
    }

    // private void OnTriggerEnter(
    //     Collider other
    // )
    // {
    //         if (!other.CompareTag("Player")) return;
    //
    //         SoulObject soul = GetComponent<SoulObject>();
    //
    //         if (soul != null)
    //         {
    //             soul.StartVacuum(() =>
    //             {
    //                 gameManager.AddSoul(soul.soulType);
    //             });
    //         }
    //     
    //     if (
    //         !other.CompareTag("Player")
    //     )
    //     {
    //         return;
    //     }
    //
    //     if (soulRank == SoulRank.Common)
    //     {
    //         gameManager.AddMite(1);
    //
    //         Debug.Log(
    //             "Converted to 1 Mite"
    //         );
    //     }
    //     else
    //     {
    //         gameManager.AddSoul(
    //             SoulType
    //         );
    //     }
    //
    //     Debug.Log(
    //         "Collected " +
    //         SoulType +
    //         " Soul!"
    //     );
    //
    //     Destroy(gameObject);
    // }
    
}